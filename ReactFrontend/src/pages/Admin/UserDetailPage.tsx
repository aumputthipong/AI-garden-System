import { useState, useEffect } from 'react';
import MiniFooter from '../../components/MiniFooter';
import AdminSidebar from '../../components/AdminSidebar';
import { Link, useParams } from 'react-router-dom';
import AiApprovedListTable from '../../components/table/AiApprovedListTable';
import WorkspaceCard from '../../components/card/WorkspaceCard';
import AddAIDialog from '../../components/AddAIDialog';
import { Workspace } from '../../types/Workspace';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import { useUserMutation } from '../../hook/user/useUserMutation';
import { useUserData } from '../../hook/user/useUserData';
import { useWorkspaceData } from '../../hook/workspaces/useWorkspaceData';
import { useAiData } from '../../hook/ai/useAiData';
import { getImageUrl } from '../../function/util';
import { useAuth } from "../../context/AuthContext";

const UserDetailPage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [userTab, setUserTab] = useState<string>('Ai');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const { userDetailById, isLoadinguserDetailById } = useUserData();
  const [actionType, setActionType] = useState<'promote' | 'demote'>('promote');
  const { promoteToAdminMutation, demoteFromAdminMutation } = useUserMutation();
  const { allAiModelWithApprovalData, isLoadingallAiModelWithApproval } = useAiData();
  const { user } = useAuth(); 

  const allowedPromoters = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email: string) => email.trim())
    .filter(Boolean);


  const canPromote = user && allowedPromoters.includes(user.email);
  const isInAllowedPromoters = allowedPromoters.includes(userDetailById?.email);
  const isTargetAdmin = userDetailById?.role === "admin";
  

  const aiCount = allAiModelWithApprovalData
    ? allAiModelWithApprovalData.filter((ai: { permissions?: { approve: boolean }[] }) =>
      ai.permissions?.some((permission: { approve: boolean }) => permission.approve)
    ).length
    : 0;

  const {
    personalWorkspaceData: myWorkspace = [],
    isLoadingPersonalWorkspaceData: isLoadingWorkspaces,
    refetchPersonalWorkspaceData: refetchWorkspaces
  } = useWorkspaceData();


  useEffect(() => {
    if (userId) {
      refetchWorkspaces();
    }
  }, [userId, refetchWorkspaces]);

  const handleAction = () => {
    if (!userId) return;

    if (actionType === 'promote') {
      promoteToAdminMutation.mutate({ userId }, { onSuccess: () => setOpenConfirmDialog(false) });
    } else {
      demoteFromAdminMutation.mutate({ userId }, { onSuccess: () => setOpenConfirmDialog(false) });
    }
  };


  return (
    <>
      <div className="flex h-full min-h-screen bg-neutral-100">
        <AdminSidebar />
        <div className="w-10/12 ml-auto bg-neutral-100 flex flex-col items-center pb-32 h-full min-h-screen">
          <div className="mt-4 pb-5 h-fit w-[95%] bg-white rounded-[15px] relative">
            {/* Header: User Profile */}
            <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-[15px] text-white h-28">
              <div className="absolute top-5 right-5">
              {canPromote && (
            <Button
              onClick={() => {
                setActionType(isTargetAdmin ? 'demote' : 'promote'); 
                setOpenConfirmDialog(true);
              }}
              variant="outlined"
              sx={{
                background: 'white',
                borderColor: isTargetAdmin ? "#e11d48" : "#4f46e5",
                color: isTargetAdmin ? "#e11d48" : "#4f46e5",
                "&:hover": {
                  borderColor: isTargetAdmin ? "#be123c" : "#3730a3",
                  backgroundColor: isTargetAdmin ? "rgba(225, 29, 72, 0.1)" : "rgba(79, 70, 229, 0.1)"
                }
              }}
              startIcon={<AdminPanelSettings />}
              disabled={isInAllowedPromoters}
            >
              {isInAllowedPromoters ? "ไม่สามารถ Demote Promoter ได้" : isTargetAdmin ? "Demote จาก Admin" : "Promote เป็น Admin"}
            </Button>
          )}
              </div>
              <img
                className="absolute w-32 h-32 rounded-full border-4 border-white top-[52px] left-6"
                src={getImageUrl(userDetailById?.picture) || '/images/default-profile.png'}
                alt="User"
              />
            </div>

            <div className="ml-6 mt-20">
              {isLoadinguserDetailById ? (
                <p className="text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</p>
              ) : userDetailById ? (
                <>
                  <h2 className="text-3xl font-semibold">
                    <i className="bi bi-person-circle"></i> {userDetailById.name}
                  </h2>
                  <p className="text-xl text-blue-500">
                    <i className="bi bi-envelope"></i> : {userDetailById.email || 'N/A'}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
              )}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex justify-start px-6">
              <button
                onClick={() => setUserTab('Ai')}
                className={`w-1/2 border-b-2 rounded-t-lg cursor-pointer px-4 py-2 text-center font-medium ${userTab === 'Ai' ? 'text-indigo-600 border-indigo-600' : 'border-transparent text-gray-600 hover:border-gray-300'}`}
              >
                <i className="bi bi-card-list"></i> รายชื่อสิทธิ์ AI
              </button>

              <button
                onClick={() => setUserTab('Workspace')}
                className={`w-1/2 border-b-2 rounded-t-lg cursor-pointer px-4 py-2 text-center font-medium ${userTab === 'Workspace' ? 'text-indigo-600 border-indigo-600' : 'border-transparent text-gray-600 hover:border-gray-300'}`}
              >
                <i className="bi bi-laptop"></i> Workspace
              </button>
            </div>

            <div className="py-6 border-t">
              {userTab === 'Ai' ? (
                <div className="px-6">
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-xl font-medium text-indigo-800">
                      <i className="bi bi-file-earmark-check-fill"></i> AI ได้รับสิทธิ์ : {isLoadingallAiModelWithApproval ? 'กำลังโหลด...' : aiCount}
                    </span>
                    <AddAIDialog />
                  </div>
                  <AiApprovedListTable userId={userId} />
                </div>
              ) : (
                <div className="grid grid-cols-3 pb-8 pt-2">
                  {isLoadingWorkspaces ? (
                    <p className="text-gray-500">กำลังโหลดข้อมูล Workspace...</p>
                  ) : (
                    myWorkspace.map((data: Workspace) => (
                      <div key={data.workspaceId} className="mb-4">
                        <Link to={`/workspaces/${data.workspaceId}/project-list`}>
                          <WorkspaceCard {...data} />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MiniFooter />
      {/* 🔵 Dialog ยืนยันการ Promote/Demote */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>{actionType === 'promote' ? "ยืนยันการ Promote" : "ยืนยันการ Demote"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณต้องการ {actionType === 'promote' ? "Promote" : "Demote"} <b>{userDetailById?.name}</b> {actionType === 'promote' ? "เป็น Admin" : "จาก Admin"} หรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="secondary">
            ยกเลิก
          </Button>
          <Button onClick={handleAction} color={actionType === 'promote' ? "primary" : "error"} variant="contained">
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>


    </>
  );
};

export default UserDetailPage;
